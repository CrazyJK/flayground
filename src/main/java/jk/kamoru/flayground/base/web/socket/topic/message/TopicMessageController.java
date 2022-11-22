package jk.kamoru.flayground.base.web.socket.topic.message;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TopicMessageController {

  @Autowired TopicMessageService topicMessageService;

  /**
   * 외부에서 메시지를 전달때
   * @param subject
   * @param body
   * @param from
   * @param to
   */
  @GetMapping("/topic/message/{from}/{to}/{subject}/{body}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void pushToUser(@PathVariable String from, @PathVariable String to, @PathVariable String subject, @PathVariable String body) {
    topicMessageService.send(subject, body, from, to);
  }

}
