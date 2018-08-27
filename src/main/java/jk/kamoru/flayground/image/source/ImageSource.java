package jk.kamoru.flayground.image.source;

import java.util.List;

import jk.kamoru.flayground.image.domain.Image;

public interface ImageSource<T extends Image> {

	List<T> getList();

	T get(int idx);

	int size();

	void delete(int idx);

}
