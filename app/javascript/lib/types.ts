export interface PresetAmount {
  amountCents: number;
  label: string;
}

export interface Stats {
  raisedCents: number;
  donorsCount: number;
  percent: number;
  goalAmountCents: number;
}

export interface CharityOrganization {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  websiteUrl?: string | null;
  charityNumber?: string | null;
  aboutHtml?: string | null;
  aboutRaw?: string | null;
  avatarUrl?: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  subtitle?: string | null;
  storyHtml?: string | null;
  storyHtmlRaw?: string | null;
  storyImageUrls?: string[];
  coverImageUrl?: string | null;
  goalAmountCents: number;
  currency: string;
  presetAmounts: PresetAmount[];
  stats: Stats;
  charityOrganization: CharityOrganization;
}

export interface Donation {
  id: string;
  displayName: string | null;
  amountCents: number;
  currency: string;
  recurring: boolean;
  comment: string | null;
  pending: boolean;
  createdAt: string;
}

export interface RecentDonations {
  donations: Donation[];
  totalCount: number;
  nextPage: number | null;
}
