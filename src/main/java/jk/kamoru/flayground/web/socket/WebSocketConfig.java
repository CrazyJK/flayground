package jk.kamoru.flayground.web.socket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private static final String STOMP_ENDPOINT = "/flayground-notification";

	private static final String APP_DEST_PREFIX_FLAY  = "/flay";

	private static final String ANNOUNCE = "/announce";
	private static final String SHOUTING = "/shouting";
	private static final String LISTEN   = "/listen";

	public  static final String DESTINATION_ANNOUNCE_LISTEN = ANNOUNCE + LISTEN;
	public  static final String DESTINATION_SHOUTING_LISTEN = SHOUTING + LISTEN;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(STOMP_ENDPOINT).withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker(ANNOUNCE, SHOUTING);
        config.setApplicationDestinationPrefixes(APP_DEST_PREFIX_FLAY);
    }

}