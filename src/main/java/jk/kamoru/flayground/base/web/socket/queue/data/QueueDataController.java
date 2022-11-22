package jk.kamoru.flayground.base.web.socket.queue.data;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.DATA;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
public class QueueDataController {

  @Autowired QueueDataService queueDataService;

  @MessageMapping(DATA)
  public void queue(QueueData queueData) {
    log.debug("queue: {}", queueData);
    queueDataService.queue(queueData);
  }

}
