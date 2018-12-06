package jk.kamoru.flayground.web.socket.shout;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import jk.kamoru.flayground.web.socket.WebSocketConfig;
import jk.kamoru.flayground.web.socket.notice.Notice;

@Controller
public class ShoutController {

    @MessageMapping(WebSocketConfig.DESTINATION_APP_SUFFIX_SHOUT)
    @SendTo(WebSocketConfig.DESTINATION_SHOUT_LISTEN)
    public Notice shout(Shouting message) {
        return new Notice(message.getName(), HtmlUtils.htmlEscape(message.getContent()));
    }

}
