package jk.kamoru.flayground.image;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jk.kamoru.flayground.image.banner.AnsiColors.BitDepth;
import jk.kamoru.flayground.image.banner.ImageBannerPrinter;
import jk.kamoru.flayground.image.banner.ImageBannerPrinter.PixelMode;
import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.service.ImageService;

@RestController
@RequestMapping("/banner")
public class ImageBannerHandler {

	@Autowired ImageService imageService;
	@Autowired ImageBannerPrinter imageBannerPrinter;

	@GetMapping("/{idx}/{width}/{height}")
	public String getBannerImage(@PathVariable int idx, @PathVariable int width, @PathVariable int height,
			@RequestParam(required = false, defaultValue = "false") boolean invert,
			@RequestParam(required = false, defaultValue = "FOUR") BitDepth bitDepth,
			@RequestParam(required = false, defaultValue = "TEXT") PixelMode pixelMode) {
		Image image = imageService.get(idx);
		return imageBannerPrinter.get(image.getFile(), width, height, 0, invert, bitDepth, pixelMode);
	}

}
