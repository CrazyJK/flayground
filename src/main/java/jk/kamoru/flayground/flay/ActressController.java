package jk.kamoru.flayground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.info.Actress;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/flay/actress")
public class ActressController {

	@Autowired FlayService flayService;
	
	@GetMapping("/{name}")
	public Actress get(@PathVariable String name) {
		return flayService.getActress(name);
	}
	
	@GetMapping("/list")
	public Collection<Actress> getList(@ModelAttribute Search search) {
		return flayService.getActressList(search);
	}

}
