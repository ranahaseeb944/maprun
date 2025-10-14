class CreatePlots < ActiveRecord::Migration[7.1]
  def change
    create_table :plots do |t|
      t.references :map, null: false, foreign_key: true
      t.string :number
      t.integer :x
      t.integer :y
      t.integer :width
      t.integer :height

      t.timestamps
    end
  end
end
