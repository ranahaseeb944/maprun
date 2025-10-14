class Map < ApplicationRecord
  has_one_attached :image
  has_many :plots, dependent: :destroy
end
