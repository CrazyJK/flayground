package jk.kamoru.flayground.web.socket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.socket.config.WebSocketMessageBrokerStats;

@RestController
@RequestMapping("/websocket")
public class WebSocketController {

	@Autowired WebSocketMessageBrokerStats webSocketMessageBrokerStats;

	@GetMapping("/stats")
	public String websocketInfo() {
		return webSocketMessageBrokerStats.toString();
	}

}
