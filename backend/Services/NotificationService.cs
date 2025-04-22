using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using System.Text.RegularExpressions;
using Amazon.Runtime;

namespace backend.Services
{
    public class NotificationService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<NotificationService> _logger;
        private const string EMAIL_TOPIC_ARN = "arn:aws:sns:us-east-1:639765866437:topic-g7"; // Replace with your actual SNS topic ARN
        
        public NotificationService(IConfiguration configuration, ILogger<NotificationService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }
        
        private AmazonSimpleNotificationServiceClient GetSnsClient(bool forEmailSubscription = false)
        {
            // For other operations, check if we have credentials configured
            var accessKey = _configuration["AWS:AccessKey"];
            var secretKey = _configuration["AWS:SecretKey"];
            var sessionToken = _configuration["AWS:SessionToken"]; // Add session token
            
            if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
            {
                _logger.LogInformation("Using configured AWS credentials");
                
                AWSCredentials credentials;
                if (!string.IsNullOrEmpty(sessionToken))
                {
                    // Use temporary credentials with session token
                    credentials = new SessionAWSCredentials(accessKey, secretKey, sessionToken);
                    _logger.LogInformation("Using session credentials");
                }
                else
                {
                    // Use basic credentials
                    credentials = new BasicAWSCredentials(accessKey, secretKey);
                    _logger.LogInformation("Using basic credentials");
                }
                
                return new AmazonSimpleNotificationServiceClient(credentials, Amazon.RegionEndpoint.USEast1);
            }
            else
            {
                _logger.LogInformation("Using environment AWS credentials");
                // Use environment credentials
                return new AmazonSimpleNotificationServiceClient(Amazon.RegionEndpoint.USEast1);
            }
        }
        
        public async Task<string> SubscribeEmailAsync(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                throw new ArgumentException("Email cannot be empty");
            }
            
            // Validate email format
            if (!IsValidEmail(email))
            {
                throw new ArgumentException("Invalid email format");
            }
            
            _logger.LogInformation($"Attempting to subscribe email: {email}");
            _logger.LogInformation($"Using topic ARN: {EMAIL_TOPIC_ARN}");
            
            try
            {
                // Try with credentials first
                using var snsClient = GetSnsClient(false);
                
                var subscribeRequest = new SubscribeRequest
                {
                    TopicArn = EMAIL_TOPIC_ARN,
                    Protocol = "email",
                    Endpoint = email,
                    Attributes = new Dictionary<string, string>
                    {
                        { "FilterPolicy", "{\"notificationType\": [\"trade\", \"alert\", \"test\"]}" }
                    }
                };
                
                var response = await snsClient.SubscribeAsync(subscribeRequest);
                _logger.LogInformation($"Successfully subscribed email. Subscription ARN: {response.SubscriptionArn}");
                // For email subscriptions, the subscription ARN is "pending confirmation" until the user confirms
                return response.SubscriptionArn ?? "pending confirmation";
            }
            catch (AmazonSimpleNotificationServiceException ex)
            {
                _logger.LogError($"AWS SNS Error: {ex.Message}");
                _logger.LogError($"Error Code: {ex.ErrorCode}");
                _logger.LogError($"Status Code: {ex.StatusCode}");
                _logger.LogError($"Request ID: {ex.RequestId}");
                throw new Exception($"Failed to subscribe email: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"General Error: {ex.Message}");
                _logger.LogError($"Stack Trace: {ex.StackTrace}");
                throw new Exception($"Failed to subscribe email: {ex.Message}");
            }
        }
        
        public async Task UnsubscribeEmailAsync(string subscriptionArn)
        {
            if (string.IsNullOrEmpty(subscriptionArn) || subscriptionArn == "pending confirmation")
                return;
                
            try
            {
                using var snsClient = GetSnsClient();
                await snsClient.UnsubscribeAsync(subscriptionArn);
                _logger.LogInformation($"Successfully unsubscribed email. Subscription ARN: {subscriptionArn}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error unsubscribing email: {ex.Message}");
                // Don't throw exception on unsubscribe failure for better user experience
            }
        }
        
        public async Task PublishMessageAsync(string message, string subject, string notificationType = "general")
        {
            try
            {
                using var snsClient = GetSnsClient();
                
                var publishRequest = new PublishRequest
                {
                    TopicArn = EMAIL_TOPIC_ARN,
                    Message = message,
                    Subject = subject,
                    MessageAttributes = new Dictionary<string, MessageAttributeValue>
                    {
                        { 
                            "notificationType", 
                            new MessageAttributeValue 
                            { 
                                DataType = "String", 
                                StringValue = notificationType 
                            } 
                        }
                    }
                };
                
                await snsClient.PublishAsync(publishRequest);
                _logger.LogInformation($"Successfully published message to topic: {EMAIL_TOPIC_ARN}");
            }
            catch (AmazonSimpleNotificationServiceException ex)
            {
                _logger.LogError($"AWS SNS Error: {ex.Message}");
                _logger.LogError($"Error Code: {ex.ErrorCode}");
                _logger.LogError($"Status Code: {ex.StatusCode}");
                throw new Exception($"Failed to send notification: {ex.Message}");
            }
        }
        
        private bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                return Regex.IsMatch(email,
                    @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                    RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(250));
            }
            catch (RegexMatchTimeoutException)
            {
                return false;
            }
        }
    }
}