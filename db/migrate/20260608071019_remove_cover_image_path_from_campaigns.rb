class RemoveCoverImagePathFromCampaigns < ActiveRecord::Migration[8.1]
  def change
    remove_column :campaigns, :cover_image_path, :string
  end
end
