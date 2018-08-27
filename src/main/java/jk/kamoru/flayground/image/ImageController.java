package jk.kamoru.flayground.image;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.service.ImageService;

@RestController
@RequestMapping("/image")
public class ImageController {

	@Autowired
	ImageService<Image> imageService;
	
	@GetMapping("/list")
	public List<Image> list() {
		return imageService.getImageList();
	}

	@GetMapping("/size")
	public int size() {
		return imageService.getImageSourceSize();
	}

	@GetMapping("/random")
	public Image random() {
		return imageService.getImageByRandom();
	}

	@GetMapping("/{idx}")
	public Image get(@PathVariable int idx) {
		return imageService.getImage(idx);
	}

	@DeleteMapping("/{idx}")
	public void delete(@PathVariable int idx) {
		imageService.delete(idx);
	}
	
}
