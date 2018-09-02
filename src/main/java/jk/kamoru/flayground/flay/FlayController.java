package jk.kamoru.flayground.flay;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;

@RestController
@RequestMapping("/flay")
public class FlayController {

	@Autowired FlayService flayService;
	
	@GetMapping("/list")
	public Collection<Flay> getList(@ModelAttribute Search search) {
		return flayService.find(search);
	}

	@GetMapping("/opus")
	public Collection<String> getOpusList(@ModelAttribute Search search) {
		return flayService.find(search).stream().map(f -> f.getOpus()).collect(Collectors.toList());
	}

	@GetMapping("/{opus}")
	public Flay get(@PathVariable String opus) {
		return flayService.get(opus);
	}

	@GetMapping("/find/{field}/{value}")
	public Collection<Flay> findByFieldValue(@PathVariable String field, @PathVariable String value) {
		return flayService.findByKeyValue(field, value);
	}

	@PatchMapping("/{opus}/play")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void play(@PathVariable String opus) {
		flayService.play(opus);
	}

	@PatchMapping("/{opus}/edit")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void edit(@PathVariable String opus) {
		flayService.edit(opus);
	}

}
