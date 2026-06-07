class CharityOrganization < ApplicationRecord
  has_many :campaigns, dependent: :destroy

  validates :name, presence: true
end
