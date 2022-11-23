package jk.kamoru.flayground.base.web.socket.queue.data;

import static jk.kamoru.flayground.base.web.socket.WebSocketConfig.DATA;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

@Controller
public class QueueDataController {

  @Autowired
  QueueDataService queueDataService;

  @MessageMapping(DATA)
  public void queue(String data, @Header("from") String from, @Header("to") String to) {
    queueDataService.queue(data, from, to);
  }

}
