namespace VedaTax.Api.Models;

/// <summary>A taxation jurisdiction shown as a top-level item in the Services menu (US / Canada / India).</summary>
public class Country
{
    public int Id { get; set; }
    public string Code { get; set; } = "";          // "us", "ca", "in"
    public string Name { get; set; } = "";          // "United States"
    public string MenuTitle { get; set; } = "";     // "US Taxation"
    public string Tagline { get; set; } = "";       // short line used in the mega-menu
    public string HeroEyebrow { get; set; } = "";
    public string HeroTitle { get; set; } = "";
    public string HeroSubtitle { get; set; } = "";
    public string Currency { get; set; } = "USD";
    public string CurrencySymbol { get; set; } = "$";
    public int SortOrder { get; set; }

    public List<TaxService> Services { get; set; } = new();
}

/// <summary>A sub-service listed under a country in the Services submenu.</summary>
public class TaxService
{
    public int Id { get; set; }
    public int CountryId { get; set; }
    public Country? Country { get; set; }

    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string PageTitle { get; set; } = "";
    public string ShortDescription { get; set; } = "";
    public string Overview { get; set; } = "";
    public string HowItWorks { get; set; } = "";
    public List<string> WhatToPrepare { get; set; } = new();
    public List<string> Highlights { get; set; } = new();
    public decimal StartingPrice { get; set; }
    public string PriceUnit { get; set; } = "per return";
    public string? OfficialResourceName { get; set; }
    public string? OfficialResourceUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public List<ServiceFaq> Faqs { get; set; } = new();
}

public class ServiceFaq
{
    public int Id { get; set; }
    public int TaxServiceId { get; set; }
    public TaxService? TaxService { get; set; }
    public string Question { get; set; } = "";
    public string Answer { get; set; } = "";
    public int SortOrder { get; set; }
}

public class Enquiry
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Phone { get; set; }
    public string CountryCode { get; set; } = "";
    public string? ServiceSlug { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = "New";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? UserId { get; set; }
    public AppUser? User { get; set; }
}

public class AppUser
{
    public int Id { get; set; }
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Phone { get; set; }
    public string? AlternatePhone { get; set; }
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "Client";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// ===================== Client portal =====================

/// <summary>Progress stages of a filing, in order (shown as the "Your file status" bar).</summary>
public static class FilingStages
{
    public const string Registered = "Registered";
    public const string DocumentsUploaded = "DocumentsUploaded";
    public const string PreparationPending = "PreparationPending";
    public const string ReviewCompleted = "ReviewCompleted";
    public const string InvoicePaid = "InvoicePaid";
    public const string Completed = "Completed";

    public static readonly string[] All =
        [Registered, DocumentsUploaded, PreparationPending, ReviewCompleted, InvoicePaid, Completed];

    public static int IndexOf(string stage) => Array.IndexOf(All, stage);
}

/// <summary>One client's return for one country and tax year (e.g. US 2025, India FY 2025-26).</summary>
public class ClientFiling
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser? User { get; set; }
    public string CountryCode { get; set; } = "";   // us / ca / in
    public int TaxYear { get; set; }                // calendar year; for India, the FY start year
    public string Status { get; set; } = FilingStages.Registered;
    public string? ConsultantName { get; set; }
    public string? ConsultantEmail { get; set; }
    public string? ConsultantPhone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<ClientDocument> Documents { get; set; } = new();
    public Invoice? Invoice { get; set; }
}

public static class DocumentCategories
{
    public const string Client = "client";     // uploaded by the client
    public const string Expert = "expert";     // shared by a VedaTax tax expert for review
    public const string Download = "download"; // final deliverables (filed return, acknowledgement…)
    public static readonly string[] All = [Client, Expert, Download];
}

public class ClientDocument
{
    public int Id { get; set; }
    public int FilingId { get; set; }
    public ClientFiling? Filing { get; set; }
    public string Category { get; set; } = DocumentCategories.Client;
    public string DocumentType { get; set; } = "";
    public string FileName { get; set; } = "";      // original name shown to users
    public string StoredName { get; set; } = "";    // name on disk
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }
    public string? Comments { get; set; }
    public int UploadedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Invoice
{
    public int Id { get; set; }
    public int FilingId { get; set; }
    public ClientFiling? Filing { get; set; }
    public string InvoiceNumber { get; set; } = "";
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public string Currency { get; set; } = "USD";
    public decimal ReferralBonus { get; set; }
    public string Status { get; set; } = "Unpaid";  // Unpaid / Paid
    public DateTime? PaidAt { get; set; }
    public List<InvoiceItem> Items { get; set; } = new();
}

public class InvoiceItem
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }
    public string Description { get; set; } = "";
    public decimal Amount { get; set; }
    public int SortOrder { get; set; }
}

/// <summary>A friend referred by a client from Refer &amp; Earn.</summary>
public class Referral
{
    public int Id { get; set; }
    public int ReferrerUserId { get; set; }
    public AppUser? Referrer { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
