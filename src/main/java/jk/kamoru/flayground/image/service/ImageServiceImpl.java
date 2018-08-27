package jk.kamoru.flayground.image.service;

import java.util.List;

import org.apache.commons.lang3.RandomUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.source.ImageSource;

@Service
public class ImageServiceImpl implements ImageService<Image> {

	@Autowired ImageSource<Image> imageSource;
	
	@Override
	public List<Image> getImageList() {
		return imageSource.getList();
	}

	@Override
	public Image getImage(int idx) {
		return imageSource.get(idx);
	}

	@Override
	public Image getImageByRandom() {
		return imageSource.get(RandomUtils.nextInt(0, getImageSourceSize()));
	}

	@Override
	public int getImageSourceSize() {
		return imageSource.size();
	}

	@Override
	public void delete(int idx) {
		imageSource.delete(idx);
	}

}
