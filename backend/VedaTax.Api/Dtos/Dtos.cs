using System.ComponentModel.DataAnnotations;

namespace VedaTax.Api.Dtos;

// ---- Services menu / pages ----
public record MenuServiceDto(string Slug, string Title, string ShortDescription);

public record MenuCountryDto(string Code, string Name, string MenuTitle, string Tagline,
    IReadOnlyList<MenuServiceDto> Services);

public record CountryDto(string Code, string Name, string MenuTitle, string Tagline, string HeroEyebrow,
    string HeroTitle, string HeroSubtitle, string Currency, string CurrencySymbol,
    IReadOnlyList<ServiceSummaryDto> Services);

public record ServiceSummaryDto(string Slug, string Title, string ShortDescription, IReadOnlyList<string> Highlights,
    decimal StartingPrice, string PriceUnit);

public record FaqDto(string Question, string Answer);

public record ServiceDetailDto(string CountryCode, string CountryName, string MenuTitle, string Currency,
    string CurrencySymbol, string Slug, string Title, string PageTitle, string ShortDescription, string Overview,
    string HowItWorks, IReadOnlyList<string> WhatToPrepare, IReadOnlyList<string> Highlights, decimal StartingPrice,
    string PriceUnit, string? OfficialResourceName, string? OfficialResourceUrl, IReadOnlyList<FaqDto> Faqs,
    IReadOnlyList<MenuServiceDto> RelatedServices);

// ---- Enquiries (free consultation pop-up) ----
public class CreateEnquiryRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string FullName { get; set; } = "";
    [Required, EmailAddress, StringLength(200)] public string Email { get; set; } = "";
    [Phone, StringLength(30)] public string? Phone { get; set; }
    [Required, RegularExpression("^(us|ca|in)$", ErrorMessage = "Country must be us, ca or in.")]
    public string CountryCode { get; set; } = "";
    [StringLength(100)] public string? ServiceSlug { get; set; }
    [StringLength(2000)] public string? Message { get; set; }
}

public record EnquiryDto(int Id, string FullName, string Email, string? Phone, string CountryCode,
    string? ServiceSlug, string? Message, string Status, DateTime CreatedAt);

// ---- Auth ----
public class RegisterRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string FullName { get; set; } = "";
    [Required, EmailAddress, StringLength(200)] public string Email { get; set; } = "";
    [Phone, StringLength(30)] public string? Phone { get; set; }
    [Required, StringLength(100, MinimumLength = 8)] public string Password { get; set; } = "";
}

public class LoginRequest
{
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}

public record UserDto(int Id, string FullName, string Email, string? Phone, string Role);

public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);
