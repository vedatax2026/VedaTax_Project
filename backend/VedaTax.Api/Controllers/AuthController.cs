using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VedaTax.Api.Data;
using VedaTax.Api.Dtos;
using VedaTax.Api.Models;
using VedaTax.Api.Services;

namespace VedaTax.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokens, IPasswordHasher<AppUser> hasher) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new ProblemDetails { Title = "An account with this email already exists." });

        var user = new AppUser { FullName = req.FullName.Trim(), Email = email, Phone = req.Phone?.Trim() };
        user.PasswordHash = hasher.HashPassword(user, req.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return Ok(Issue(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
            return Unauthorized(new ProblemDetails { Title = "Invalid email or password." });
        return Ok(Issue(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(sub, out var id)) return Unauthorized();
        var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        return u is null ? Unauthorized() : Ok(new UserDto(u.Id, u.FullName, u.Email, u.Phone, u.Role));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest req)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(sub, out var id)) return Unauthorized();
        var u = await db.Users.FirstOrDefaultAsync(x => x.Id == id);
        if (u is null) return Unauthorized();
        if (hasher.VerifyHashedPassword(u, u.PasswordHash, req.CurrentPassword) == PasswordVerificationResult.Failed)
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(req.CurrentPassword)] = ["Your current password is incorrect."]
            }));
        if (req.CurrentPassword == req.NewPassword)
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                [nameof(req.NewPassword)] = ["Choose a password different from your current one."]
            }));
        u.PasswordHash = hasher.HashPassword(u, req.NewPassword);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private AuthResponse Issue(AppUser u)
    {
        var (token, exp) = tokens.Create(u);
        return new AuthResponse(token, exp, new UserDto(u.Id, u.FullName, u.Email, u.Phone, u.Role));
    }
}
