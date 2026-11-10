namespace VedaTax.Api.Services;

public record DocumentTypeOption(string Value, string Label, string Group);

public record OrganizerSection(string Title, string[] Questions);

/// <summary>Static, per-country rules for the client portal: tax-year labels, deadlines, document types
/// and the questions printed in the downloadable Tax Organizer.</summary>
public static class PortalCatalog
{
    public static readonly string[] CountryCodes = ["us", "ca", "in"];

    public static string CountryName(string code) => code switch
    {
        "us" => "United States",
        "ca" => "Canada",
        "in" => "India",
        _ => code.ToUpperInvariant()
    };

    public static string Currency(string code) => code switch { "ca" => "CAD", "in" => "INR", _ => "USD" };

    /// <summary>"2025" for US/Canada; "FY 2025-26" for India (financial year April–March).</summary>
    public static string YearLabel(string code, int year) =>
        code == "in" ? $"FY {year}-{(year + 1) % 100:00}" : year.ToString();

    /// <summary>The latest tax year that can be filed today, and the three before it.</summary>
    public static int[] AvailableYears(string code, DateOnly today)
    {
        // US/CA: last calendar year. India: the last completed FY (Apr–Mar).
        var latest = code == "in"
            ? (today.Month >= 4 ? today.Year - 1 : today.Year - 2)
            : today.Year - 1;
        return [latest, latest - 1, latest - 2, latest - 3];
    }

    /// <summary>Standard due date for individuals (no extensions).</summary>
    public static DateOnly DueDate(string code, int year) => code switch
    {
        "ca" => new DateOnly(year + 1, 4, 30),
        "in" => new DateOnly(year + 1, 7, 31),
        _ => new DateOnly(year + 1, 4, 15)
    };

    public static string AuthorityName(string code) => code switch
    {
        "ca" => "CRA",
        "in" => "Income Tax Department",
        _ => "IRS"
    };

    /// <summary>Bonus credited to the referrer when a referred friend pays an invoice in this country.</summary>
    public static decimal ReferralBonus(string code) => code switch { "in" => 1000m, _ => 25m };

    public const string TaxOrganizerType = "Tax_Organizer";
    public const string OtherType = "Other_Document";

    public static IReadOnlyList<DocumentTypeOption> DocumentTypes(string code)
    {
        var list = code switch
        {
            "ca" => new List<DocumentTypeOption>
            {
                new("T4", "T4 – Employment income", "Income slips"),
                new("T4A", "T4A – Pension, retirement & other income", "Income slips"),
                new("T5", "T5 – Investment income", "Income slips"),
                new("T3", "T3 – Trust income", "Income slips"),
                new("T5008", "T5008 – Securities transactions", "Income slips"),
                new("T4E", "T4E – Employment Insurance benefits", "Income slips"),
                new("NR4", "NR4 – Non-resident income", "Income slips"),
                new("RRSP_Receipt", "RRSP / FHSA contribution receipts", "Deductions & credits"),
                new("T2202", "T2202 – Tuition certificate", "Deductions & credits"),
                new("Childcare_Receipts", "Childcare expense receipts", "Deductions & credits"),
                new("Medical_Receipts", "Medical expense receipts", "Deductions & credits"),
                new("Donation_Receipts", "Charitable donation receipts", "Deductions & credits"),
                new("Rent_Property_Tax", "Rent / property tax receipts", "Deductions & credits"),
                new("Foreign_Income", "Foreign income & foreign tax paid", "Other"),
                new("Notice_Of_Assessment", "Prior-year Notice of Assessment", "Other"),
            },
            "in" => new List<DocumentTypeOption>
            {
                new("Form_16", "Form 16 – Salary TDS certificate", "Income"),
                new("Form_16A", "Form 16A – Other TDS certificates", "Income"),
                new("AIS_26AS", "AIS / Form 26AS", "Income"),
                new("Bank_Interest", "Bank / FD interest certificate", "Income"),
                new("Capital_Gains", "Capital gains statement (shares, MF, property)", "Income"),
                new("Rental_Income", "Rental income details", "Income"),
                new("Investment_80C", "80C / 80D / other deduction proofs", "Deductions"),
                new("Home_Loan_Certificate", "Home loan interest certificate", "Deductions"),
                new("Rent_Receipts", "Rent receipts (HRA)", "Deductions"),
                new("Foreign_Income_Form67", "Foreign income & Form 67 / tax paid abroad", "Other"),
                new("PAN_Aadhaar", "PAN / Aadhaar copy", "Other"),
                new("Previous_ITR", "Previous year ITR / acknowledgement", "Other"),
            },
            _ => new List<DocumentTypeOption>
            {
                new("W2_Form", "W-2 – Wage and tax statement", "Income (W-2 / 1099)"),
                new("1099_INT", "1099-INT – Interest", "Income (W-2 / 1099)"),
                new("1099_DIV", "1099-DIV – Dividends", "Income (W-2 / 1099)"),
                new("1099_B", "1099-B – Brokerage statement", "Income (W-2 / 1099)"),
                new("1099_R", "1099-R – Retirement distributions", "Income (W-2 / 1099)"),
                new("1099_G", "1099-G – Government payments", "Income (W-2 / 1099)"),
                new("1099_NEC_MISC", "1099-NEC / 1099-MISC", "Income (W-2 / 1099)"),
                new("1098_Mortgage", "1098 – Mortgage interest statement", "Deductions (1098)"),
                new("1098_T", "1098-T – Tuition statement", "Deductions (1098)"),
                new("1098_E", "1098-E – Student loan interest", "Deductions (1098)"),
                new("Foreign_Home_Loan", "Foreign home loan interest certificate", "Deductions (1098)"),
                new("Foreign_Accounts", "Foreign bank / investment statements (FBAR)", "Other"),
                new("Prior_Year_Return", "Prior-year tax return", "Other"),
            }
        };
        list.Add(new DocumentTypeOption(TaxOrganizerType, "Tax Organizer (filled)", "Other"));
        list.Add(new DocumentTypeOption(OtherType, "Other document", "Other"));
        return list;
    }

    public static bool IsValidDocumentType(string code, string value) =>
        DocumentTypes(code).Any(t => t.Value == value);

    public static string DocumentTypeLabel(string code, string value) =>
        DocumentTypes(code).FirstOrDefault(t => t.Value == value)?.Label ?? value;

    private static readonly OrganizerSection Personal = new("1. Personal details",
    [
        "Full name (as on government ID)", "Date of birth", "Marital status as of the last day of the tax year",
        "Current residential address", "Email and phone number", "Occupation / employer name"
    ]);

    private static readonly OrganizerSection Bank = new("Bank details for refund / payment",
    [
        "Bank name", "Account holder name", "Account number", "Routing / transit / IFSC code", "Account type (checking / savings)"
    ]);

    public static IReadOnlyList<OrganizerSection> OrganizerSections(string code) => code switch
    {
        "ca" =>
        [
            Personal with { Questions = [.. Personal.Questions, "Social Insurance Number (SIN)", "Province of residence on December 31"] },
            new("2. Residency", ["Date you became a resident of Canada (if new this year)", "Did you leave Canada during the year? Give dates", "Countries where you earned income this year"]),
            new("3. Spouse / partner and dependants", ["Spouse or common-law partner name, SIN and net income", "Dependants: name, date of birth, relationship", "Childcare expenses paid (provider and amount)"]),
            new("4. Income", ["Employment income (T4 slips)", "Self-employment or business income", "Investment income (T3 / T5 / T5008)", "Rental income and expenses", "Foreign income and foreign tax paid", "EI, CPP / OAS or other government benefits"]),
            new("5. Deductions and credits", ["RRSP / FHSA contributions", "Tuition (T2202) and student loan interest", "Medical expenses", "Charitable donations", "Moving expenses (if you moved 40 km+ for work or school)", "Rent or property tax paid (provincial credits)"]),
            new("6. Foreign property", ["Did the total cost of your foreign property exceed CAD 100,000 at any time this year? (Form T1135)"]),
            Bank with { Title = "7. Bank details for direct deposit" }
        ],
        "in" =>
        [
            Personal with { Questions = [.. Personal.Questions, "PAN", "Aadhaar number (or enrolment ID)"] },
            new("2. Residential status", ["Number of days in India during this FY", "Number of days in India in the previous four FYs", "Country of residence (if NRI) and Tax Residency Certificate available? (Y/N)"]),
            new("3. Income", ["Salary income (Form 16 from each employer)", "House property: rent received, municipal taxes, home loan interest", "Capital gains: shares, mutual funds, property (dates and amounts)", "Interest from savings, FDs, NRO accounts", "Business / professional income", "Foreign income and tax paid abroad"]),
            new("4. Deductions", ["Section 80C investments (PPF, ELSS, LIC, EPF, tuition fees)", "Section 80D health insurance premiums", "Section 80G donations", "NPS contributions (80CCD)", "Rent paid (HRA / 80GG)"]),
            new("5. Taxes paid", ["Advance tax paid (challan details)", "Self-assessment tax paid", "TDS / TCS as per Form 26AS / AIS"]),
            new("6. Assets and accounts", ["Foreign assets held (required for residents)", "Bank accounts held in India during the FY", "Choice of tax regime (old / new)"]),
            Bank with { Title = "7. Bank details for refund" }
        ],
        _ =>
        [
            Personal with { Questions = [.. Personal.Questions, "SSN / ITIN", "Filing status (single, married filing jointly, etc.)"] },
            new("2. Residency", ["States you lived in during the year, with dates", "Visa type and date of entry to the US (if applicable)", "Days spent outside the US this year"]),
            new("3. Spouse and dependants", ["Spouse name, SSN / ITIN and date of birth", "Dependants: name, SSN / ITIN, date of birth, relationship, months lived with you", "Childcare / dependant care expenses paid (provider, EIN and amount)"]),
            new("4. Income", ["Wages (W-2 from each employer)", "Interest and dividends (1099-INT / 1099-DIV)", "Stock sales (1099-B) and crypto transactions", "Self-employment / 1099-NEC income and expenses", "Retirement distributions (1099-R)", "Rental income and expenses", "Foreign income and foreign tax paid"]),
            new("5. Deductions and credits", ["Mortgage interest (1098) and property tax", "Student loan interest (1098-E) and tuition (1098-T)", "IRA / HSA contributions", "Charitable contributions", "Health insurance coverage (1095-A / B / C)"]),
            new("6. Foreign accounts (FBAR / FATCA)", ["Did the combined balance of your foreign accounts exceed USD 10,000 at any time this year? List each account with its maximum balance", "Foreign financial assets above FATCA thresholds (Form 8938)"]),
            Bank with { Title = "7. Bank details for direct deposit" }
        ]
    };
}
