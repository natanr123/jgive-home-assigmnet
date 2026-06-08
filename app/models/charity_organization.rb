class CharityOrganization < ApplicationRecord
  has_many :campaigns, dependent: :destroy

  has_one_attached :avatar

  validates :name, presence: true
end
