using System.ComponentModel.DataAnnotations;

namespace VedaTax.Api.Dtos;

// ---- Filings ----
public record ConsultantDto(string Name, string? Email, string? Phone);

public record FilingDto(int Id, string CountryCode, string CountryName, int TaxYear, string YearLabel,
    string Status, int StatusIndex, DateTime CreatedAt, ConsultantDto? Consultant);

public record FilingYearOptionDto(int TaxYear, string Label, bool Exists);

public record FilingCountryOptionDto(string Code, string Name, IReadOnlyList<FilingYearOptionDto> Years);

public class CreateFilingRequest
{
    [Required, RegularExpression("^(us|ca|in)$", ErrorMessage = "Country must be us, ca or in.")]
    public string CountryCode { get; set; } = "";
    [Range(2000, 2100)] public int TaxYear { get; set; }
}

public record MoneyDto(string Currency, decimal Amount);

public record ReferralStatsDto(int Total, int Registered, int Paid, IReadOnlyList<MoneyDto> Bonus);

public record OverviewDto(FilingDto Filing, DateOnly DueDate, int DaysToDue, string Authority,
    IReadOnlyList<string> Stages, int DocumentCount, string? InvoiceStatus, ReferralStatsDto Referrals);

// ---- Documents ----
public record DocumentTypeDto(string Value, string Label, string Group);

public record DocumentDto(int Id, string Category, string DocumentType, string DocumentTypeLabel, string FileName,
    string ContentType, long SizeBytes, string? Comments, DateTime CreatedAt, bool CanDelete);

// ---- Invoice ----
public record InvoiceItemDto(string Description, decimal Amount);

public record InvoiceDto(int Id, string InvoiceNumber, DateTime InvoiceDate, string Currency, string Status,
    DateTime? PaidAt, IReadOnlyList<InvoiceItemDto> Items, decimal Subtotal, decimal ReferralBonus, decimal Total);

public class CompanyOptions
{
    public string Name { get; set; } = "VedaTax";
    public string[] AddressLines { get; set; } = [];
    public string? Email { get; set; }
    public string? Phone { get; set; }
}

public record InvoiceViewDto(CompanyOptions Company, string ClientName, string ClientEmail, string? ClientPhone,
    string YearLabel, string CountryName, InvoiceDto? Invoice);

// ---- Referrals ----
public class ReferralInput
{
    [Required, StringLength(150, MinimumLength = 2)] public string Name { get; set; } = "";
    [Required, EmailAddress, StringLength(200)] public string Email { get; set; } = "";
    [Phone, StringLength(30)] public string? Phone { get; set; }
}

public class CreateReferralsRequest
{
    [Required, MinLength(1), MaxLength(20)] public List<ReferralInput> Referrals { get; set; } = new();
}

/// <summary>Status: Invited (no account yet) → Registered (signed up) → Paid (paid an invoice; bonus earned).</summary>
public record ReferralDto(int Id, string Name, string Email, string? Phone, DateTime CreatedAt, string Status,
    MoneyDto? Bonus);

public record CreateReferralsResult(int Added, IReadOnlyList<string> Skipped);

// ---- Profile ----
public record ProfileDto(string FullName, string Email, string? Phone, string? AlternatePhone);

public class UpdateProfileRequest
{
    [Required, StringLength(150, MinimumLength = 2)] public string FullName { get; set; } = "";
    [Required, Phone, StringLength(30)] public string Phone { get; set; } = "";
    [Phone, StringLength(30)] public string? AlternatePhone { get; set; }
}

public class ChangePasswordRequest
{
    [Required] public string CurrentPassword { get; set; } = "";
    [Required, StringLength(100, MinimumLength = 8)] public string NewPassword { get; set; } = "";
}

// ---- Admin (staff) ----
public record AdminFilingDto(int Id, int UserId, string ClientName, string ClientEmail, string CountryCode,
    string YearLabel, string Status, int DocumentCount, string? InvoiceStatus, DateTime CreatedAt, DateTime UpdatedAt,
    string? ConsultantName);

public record AdminClientDto(int Id, string FullName, string Email, string? Phone, string? AlternatePhone, DateTime CreatedAt);

public record AdminFilingDetailDto(FilingDto Filing, AdminClientDto Client, IReadOnlyList<DocumentDto> Documents,
    InvoiceDto? Invoice, string Currency, decimal AvailableReferralBonus, IReadOnlyList<string> Stages,
    DateOnly DueDate, DateTime UpdatedAt);

public class UpdateEnquiryStatusRequest
{
    [Required, RegularExpression("^(New|Contacted|Converted|Closed)$", ErrorMessage = "Status must be New, Contacted, Converted or Closed.")]
    public string Status { get; set; } = "";
}

public class UpdateFilingRequest
{
    public string? Status { get; set; }
    [StringLength(150)] public string? ConsultantName { get; set; }
    [EmailAddress, StringLength(200)] public string? ConsultantEmail { get; set; }
    [StringLength(30)] public string? ConsultantPhone { get; set; }
}

public class InvoiceItemInput
{
    [Required, StringLength(200)] public string Description { get; set; } = "";
    [Range(0, 1_000_000)] public decimal Amount { get; set; }
}

public class UpsertInvoiceRequest
{
    [Required, MinLength(1)] public List<InvoiceItemInput> Items { get; set; } = new();
    /// <summary>Optional; when omitted, the client's unused referral bonus in this currency is applied.</summary>
    [Range(0, 1_000_000)] public decimal? ReferralBonus { get; set; }
}
