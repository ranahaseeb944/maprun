class MapsController < ApplicationController
  def create
    # file param should come from multipart/form-data upload
    # uploaded_file = params[:file]

    # unless uploaded_file
    #   return render json: { error: "No file provided" }, status: :bad_request
    # end

    # Save temporarily
    file_path = Rails.root.join("tmp", "simple.jpg")

    # Call service
    results = GoogleVisionService.new(file_path).detect_text

    render json: { texts: results }
  end

  def get_plots
    file_path = Rails.root.join("tmp", "simple.jpg")

    # Call service
    results = GoogleVisionService.new(file_path).detect_text

    render json: { texts: results }
  end
end
