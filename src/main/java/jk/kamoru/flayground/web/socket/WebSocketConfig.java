package jk.kamoru.flayground.web.socket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
	
	public static final String DESTINATION_APP_PREFIX_FLAY  = "/flay";
	public static final String DESTINATION_APP_SUFFIX_SHOUT = "/shout";

	private static final String PREFIX_SHOUT    = "/shout";
	private static final String PREFIX_ANNOUNCE = "/announce";
	private static final String SUFFIX_LISTEN   = "/listen";

	public  static final String DESTINATION_SHOUT_LISTEN    = PREFIX_SHOUT    + SUFFIX_LISTEN;
	public  static final String DESTINATION_ANNOUNCE_LISTEN = PREFIX_ANNOUNCE + SUFFIX_LISTEN;
	
	private static final String STOMP_ENDPOINT = "/flayground-notification";
	
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker(PREFIX_SHOUT, PREFIX_ANNOUNCE);
        config.setApplicationDestinationPrefixes(DESTINATION_APP_PREFIX_FLAY);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(STOMP_ENDPOINT).withSockJS();
    }

}