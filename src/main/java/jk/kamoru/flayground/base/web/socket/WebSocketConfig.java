package jk.kamoru.flayground.base.web.socket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private static final String STOMP_ENDPOINT = "/flayground-websocket";
  private static final String TOPIC = "/topic";
  private static final String QUEUE = "/queue";
  private static final String APP_DEST_PREFIX = "/flayground";

  public static final String MESSAGE = "/message";
  public static final String SAY = "/say";
  public static final String DATA = "/data";

  /** 메시지 구독 */
  public static final String TOPIC_MESSAGE = TOPIC + MESSAGE;

  /** 대화 구독 */
  public static final String TOPIC_SAY = TOPIC + SAY;

  /** 정보 구독 */
  public static final String QUEUE_DATA = QUEUE + DATA;


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
