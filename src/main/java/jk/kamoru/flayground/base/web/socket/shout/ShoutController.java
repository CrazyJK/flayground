package jk.kamoru.flayground.base.web.socket.shout;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;
import jk.kamoru.flayground.base.web.socket.WebSocketConfig;
import jk.kamoru.flayground.base.web.socket.notice.Notice;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
public class ShoutController {

  @Autowired SimpMessagingTemplate messagingTemplate;

  @MessageMapping("/say")
  @SendTo(WebSocketConfig.TOPIC_SAY)
  public Notice shout(Shouting message) {
    log.debug("say {}", message);
    return new Notice(message.getName(), HtmlUtils.htmlEscape(message.getContent()));
  }

  //    @MessageMapping("/sayTo")
  //    @SendToUser(WebSocketConfig.TOPIC_SAY)
  //    public Notice sayTo(Shouting message, @Header("to") String to) {
  //    	log.info("sayTo {} -> {}", message, to);
  //        return new Notice(message.getName(), HtmlUtils.htmlEscape(message.getContent()));
  //    }

  @MessageMapping("/sayTo")
  @SendToUser(WebSocketConfig.TOPIC_SAY)
  public void sayTo(Shouting message, @Header("to") String to) {
    log.debug("sayTo {} -> {}", message, to);
    messagingTemplate.convertAndSendToUser(to, WebSocketConfig.TOPIC_SAY, new Notice(message.getName(), HtmlUtils.htmlEscape(message.getContent())));
  }

  @MessageMapping("/info")
  @SendToUser(WebSocketConfig.QUEUE_INFO)
  public Notice info(Shouting message) {
    log.debug("info {}", message);
    return new Notice(message.getName(), HtmlUtils.htmlEscape(message.getContent()));
  }

}
