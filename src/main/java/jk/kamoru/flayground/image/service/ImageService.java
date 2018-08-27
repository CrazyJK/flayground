package jk.kamoru.flayground.image.service;

import java.util.List;

import jk.kamoru.flayground.image.domain.Image;

public interface ImageService<T extends Image> {

	List<T> getImageList();
	
	T getImage(int idx);

	T getImageByRandom();

	int getImageSourceSize();

	void delete(int idx);

}
