export const CAMPAIGN_QUERY = `
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id name subtitle storyHtml coverImagePath goalAmountCents currency
      presetAmounts { amountCents label }
      stats { raisedCents donorsCount percent goalAmountCents }
      charityOrganization { id name email phoneNumber websiteUrl charityNumber aboutHtml }
    }
  }`;

export const RECENT_DONATIONS_QUERY = `
  query RecentDonations($campaignId: ID!, $page: Int, $perPage: Int) {
    recentDonations(campaignId: $campaignId, page: $page, perPage: $perPage) {
      totalCount nextPage
      donations { id displayName amountCents currency recurring comment pending createdAt }
    }
  }`;

export const CREATE_DONATION_MUTATION = `
  mutation CreateDonation($input: CreateDonationInput!) {
    createDonation(input: $input) {
      donation { id displayName amountCents pending }
      stats { raisedCents donorsCount percent goalAmountCents }
      errors
    }
  }`;
