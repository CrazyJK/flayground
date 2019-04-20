package jk.kamoru.flayground.image.service;

import java.util.List;

import org.apache.commons.lang3.RandomUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.source.ImageSource;

@Service
public class ImageServiceImpl implements ImageService {

	@Autowired ImageSource imageSource;

	@Override
	public List<Image> list() {
		return imageSource.list();
	}

	@Override
	public Image get(int idx) {
		return imageSource.get(idx);
	}

	@Override
	public Image random() {
		return imageSource.get(RandomUtils.nextInt(0, size()));
	}

	@Override
	public int size() {
		return imageSource.size();
	}

	@Override
	public void delete(int idx) {
		imageSource.delete(idx);
	}

}
