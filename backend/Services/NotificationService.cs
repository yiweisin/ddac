using Amazon;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace backend.Services
{
    public class NotificationService
    {
        private readonly AmazonSimpleNotificationServiceClient _snsClient;
        private readonly string _topicArn;
        
        public NotificationService(IConfiguration configuration)
        {
            var awsAccessKey = configuration["AWS:AccessKey"];
            var awsSecretKey = configuration["AWS:SecretKey"];
            var region = configuration["AWS:Region"];
            var topicArn = configuration["AWS:SNS:TopicArn"];
            
            _snsClient = new AmazonSimpleNotificationServiceClient(
                awsAccessKey,
                awsSecretKey,
                RegionEndpoint.GetBySystemName(region)
            );
            
            _topicArn = topicArn;
        }
        
        public async Task PublishMessageAsync(string message, string subject)
        {
            var request = new PublishRequest
            {
                Message = message,
                Subject = subject,
                TopicArn = _topicArn
            };
            
            await _snsClient.PublishAsync(request);
        }
        
        public async Task<string> SubscribeEmailAsync(string email)
        {
            var request = new SubscribeRequest
            {
                Protocol = "email",
                Endpoint = email,
                TopicArn = _topicArn,
                ReturnSubscriptionArn = true
            };
            
            var response = await _snsClient.SubscribeAsync(request);
            return response.SubscriptionArn;
        }
        
        public async Task<string> SubscribeSmsAsync(string phoneNumber)
        {
            var request = new SubscribeRequest
            {
                Protocol = "sms",
                Endpoint = phoneNumber,
                TopicArn = _topicArn,
                ReturnSubscriptionArn = true
            };
            
            var response = await _snsClient.SubscribeAsync(request);
            return response.SubscriptionArn;
        }
        
        public async Task UnsubscribeAsync(string subscriptionArn)
        {
            var request = new UnsubscribeRequest
            {
                SubscriptionArn = subscriptionArn
            };
            
            await _snsClient.UnsubscribeAsync(request);
        }
    }
}