require "net/http"
require "json"

class GoogleVisionService
  API_URL = "https://vision.googleapis.com/v1/images:annotate"

  def initialize(api_key = "AIzaSyC6MgH_nGJZPLKWzBjVNdaf_HqBAmDfpGw")
    file_path = Rails.root.join("tmp", "simple.png")
    base64_image = Base64.strict_encode64(File.read(file_path))

    @api_key = "AIzaSyC6MgH_nGJZPLKWzBjVNdaf_HqBAmDfpGw"
  end

  def detect_text(base64_image)
    uri = URI("#{"https://vision.googleapis.com/v1/images:annotate"}?key=AIzaSyC6MgH_nGJZPLKWzBjVNdaf_HqBAmDfpGw")

    body = {
      requests: [
        {
          image: { content: base64_image },
          features: [{ type: "TEXT_DETECTION" }]
        }
      ]
    }

    response = Net::HTTP.post(uri, body.to_json, "Content-Type" => "application/json")
    JSON.parse(response.body)
  end
end
