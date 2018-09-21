package jk.kamoru.flayground.flay;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/flay")
public class FlayController {

	@Autowired FlayService flayService;
	
	@GetMapping("/{opus}")
	public Flay get(@PathVariable String opus) {
		return flayService.get(opus);
	}

	@GetMapping("/list")
	public Collection<Flay> getList() {
		return flayService.list();
	}

	@GetMapping("/find")
	public Collection<Flay> findList(@RequestBody Search search) {
		return flayService.find(search);
	}

	@GetMapping("/candidates")
	public Collection<Flay> findCandidates() {
		return flayService.findCandidates();
	}

	@PatchMapping("/candidates/{opus}")
	public boolean acceptCandidates(@PathVariable String opus) {
		return flayService.acceptCandidates(opus);
	}

	@GetMapping("/find/{query}")
	public Collection<Flay> findList(@PathVariable String query) {
		return flayService.find(query);
	}

	@GetMapping("/find/{field}/{value}")
	public Collection<Flay> findByFieldValue(@PathVariable String field, @PathVariable String value) {
		return flayService.findByKeyValue(field, value);
	}

	@PatchMapping("/play/{opus}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void play(@PathVariable String opus) {
		flayService.play(opus);
	}

	@PatchMapping("/edit/{opus}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void edit(@PathVariable String opus) {
		flayService.edit(opus);
	}

	@PutMapping("/rename/{opus}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void rename(@PathVariable String opus, @RequestBody Flay flay) {
		flayService.rename(opus, flay);
	}
}
