package jk.kamoru.flayground.flay;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.flay.service.BatchService;

@RestController
@RequestMapping("/batch")
public class BatchController {

	@Autowired BatchService batchService;
	
	@GetMapping("/option/{option}")
	public Boolean getOption(@PathVariable BatchService.Option option) {
		return batchService.getOption(option);
	}

	@PutMapping("/option/{option}")
	public Boolean setOption(@PathVariable BatchService.Option option) {
		return batchService.toggleOption(option);
	}

	@PutMapping("/start/{operation}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void startBatch(@PathVariable BatchService.Operation operation) {
		batchService.startBatch(operation);
	}
	
	@PutMapping("/reload")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void reload() {
		batchService.reload();
	}
	
}
