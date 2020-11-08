package jk.kamoru.flayground.base.web.socket.notice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NoticePusher {

	@Autowired AnnounceService notificationService;

	@GetMapping("/notice/push/{title}/{content}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void push(@PathVariable String title, @PathVariable String content) {
		notificationService.announce(title, content);
	}

	@GetMapping("/notice/push/{title}/{content}/me")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void pushToMe(@PathVariable String title, @PathVariable String content) {
		notificationService.announceTo(title, content);
	}

	@GetMapping("/notice/push/{title}/{content}/{user}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void pushToUser(@PathVariable String title, @PathVariable String content, @PathVariable String user) {
		notificationService.announceTo(title, content, user);
	}

}
