package jk.kamoru.flayground.base.web.socket.topic.say;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.SAY;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class TopicSayController {

  @Autowired TopicSayService topicSayService;

  @MessageMapping(SAY)
  public void say(TopicSay topicSay) {
    topicSayService.say(topicSay);
  }

}
