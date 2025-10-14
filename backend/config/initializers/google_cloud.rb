# Google Cloud Vision API Configuration
if Rails.env.production?
  # In production, use service account credentials
  Google::Cloud.configure do |config|
    config.project_id = ENV['GOOGLE_CLOUD_PROJECT_ID']
    config.credentials = ENV['GOOGLE_CLOUD_CREDENTIALS']
  end
else

  # In development, use API key from environment variable
  Google::Cloud.configure do |config|
    config.api_key = "AIzaSyC6MgH_nGJZPLKWzBjVNdaf_HqBAmDfpGw"
  end
end
