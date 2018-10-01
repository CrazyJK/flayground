package jk.kamoru.flayground.info;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.info.service.SummaryService;

@RestController
@RequestMapping("/summary")
public class SummaryController {

	@Autowired SummaryService summaryService;

	@GetMapping("/groupby/release/{pattern}")
	public Map<String, List<Flay>> groupByRelease(@PathVariable String pattern) {
		return summaryService.groupByRelease(pattern);
	}

}
