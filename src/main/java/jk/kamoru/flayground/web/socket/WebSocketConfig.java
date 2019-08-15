package jk.kamoru.flayground.web.socket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	public  static final String STOMP_ENDPOINT = "/flayground-websocket";

	private static final String TOPIC = "/topic";
	private static final String QUEUE = "/queue";
	private static final String APP_DEST_PREFIX  = "/flayground";

	/* 서버에서 보내는 메시지 */
	public  static final String TOPIC_ANNOUNCE = TOPIC + "/announce";

	/* 사용자가 보내는 메시지 */
	public  static final String TOPIC_SAY = TOPIC + "/say";

	/* 자신에게 보내는 정보 */
	public  static final String QUEUE_INFO  = QUEUE + "/info";

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(STOMP_ENDPOINT).withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker(TOPIC, QUEUE);
        config.setApplicationDestinationPrefixes(APP_DEST_PREFIX);
    }

}