package jk.kamoru.flayground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/flay/video")
public class FlayController {

	@Autowired FlayService flayService;
	
	@GetMapping("/list")
	public Collection<Flay> getList(@ModelAttribute Search search) {
		return flayService.getFlayList(search);
	}

	@GetMapping("/{opus}")
	public Flay get(@PathVariable String opus) {
		return flayService.getFlay(opus);
	}

	@GetMapping("/find/{field}/{value}")
	public Collection<Flay> findByKeyValue(@PathVariable String field, @PathVariable String value) {
		return flayService.findFlayByKeyValue(field, value);
	}

}
