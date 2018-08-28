package jk.kamoru.flayground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Studio;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/flay/studio")
public class StudioController {

	@Autowired FlayService<Studio> studioService;
	
	@GetMapping("/{name}")
	public Studio getVideo(@PathVariable String name) {
		return studioService.get(name);
	}
	
	@GetMapping("/list")
	public Collection<Studio> getList(@ModelAttribute Search search) {
		return studioService.getList(search);
	}

}
