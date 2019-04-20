package jk.kamoru.flayground.image.source;

import java.util.List;

import jk.kamoru.flayground.image.domain.Image;

public interface ImageSource {

	List<Image> list();

	Image get(int idx);

	int size();

	void delete(int idx);
}
