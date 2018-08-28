package jk.kamoru.flayground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Actress;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/flay/actress")
public class ActressController {

	@Autowired FlayService<Actress> actressService;
	
	@GetMapping("/{name}")
	public Actress getVideo(@PathVariable String name) {
		return actressService.get(name);
	}
	
	@GetMapping("/list")
	public Collection<Actress> getList(@ModelAttribute Search search) {
		return actressService.getList(search);
	}

}
