package jk.kamoru.flayground.info;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.service.HistoryService;

@RestController
@RequestMapping("/info/history")
public class HistoryController {
	
	@Autowired HistoryService historyService;
	
	@GetMapping("/find/{query}")
	public List<History> find(@PathVariable String query) {
		return historyService.find(query);
	}

}
