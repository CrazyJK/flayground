package jk.kamoru.flayground.image.service;

import java.util.List;
import java.util.Map;

import jk.kamoru.flayground.image.domain.Image;

public interface ImageService<T extends Image> {

	List<T> list();
	
	T get(int idx);

	T random();

	int size();

	void delete(int idx);

	Map<String, List<Integer>> groupByPath();

}
