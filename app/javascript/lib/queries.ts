export const CAMPAIGN_QUERY = `
  query Campaign($id: ID!) {
    campaign(id: $id) {
      id name subtitle storyHtml coverImageUrl goalAmountCents currency
      presetAmounts { amountCents label }
      stats { raisedCents donorsCount percent goalAmountCents }
      charityOrganization { id name email phoneNumber websiteUrl charityNumber aboutHtml avatarUrl }
    }
  }`;

export const RECENT_DONATIONS_QUERY = `
  query RecentDonations($campaignId: ID!, $page: Int, $perPage: Int) {
    recentDonations(campaignId: $campaignId, page: $page, perPage: $perPage) {
      totalCount nextPage
      donations { id displayName amountCents currency recurring recurringMonths comment pending createdAt }
    }
  }`;

export const CAMPAIGN_EDIT_QUERY = `
  query CampaignEdit($id: ID!) {
    campaign(id: $id) {
      id name subtitle storyHtmlRaw goalAmountCents currency coverImageUrl storyImageUrls
      presetAmounts { amountCents label }
      charityOrganization { id name email phoneNumber websiteUrl charityNumber aboutRaw avatarUrl }
    }
  }`;

export const UPDATE_CAMPAIGN_MUTATION = `
  mutation UpdateCampaign($input: UpdateCampaignInput!) {
    updateCampaign(input: $input) {
      campaign { id }
      errors
    }
  }`;

export const CREATE_DONATION_MUTATION = `
  mutation CreateDonation($input: CreateDonationInput!) {
    createDonation(input: $input) {
      donation { id displayName amountCents recurring recurringMonths totalCents pending }
      stats { raisedCents donorsCount percent goalAmountCents }
      errors
    }
  }`;
