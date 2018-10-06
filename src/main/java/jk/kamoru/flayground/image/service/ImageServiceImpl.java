package jk.kamoru.flayground.image.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.apache.commons.lang3.RandomUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.image.domain.Image;
import jk.kamoru.flayground.image.source.ImageSource;

@Service
public class ImageServiceImpl implements ImageService<Image> {

	@Autowired ImageSource<Image> imageSource;
	
	@Override
	public List<Image> list() {
		return imageSource.getList();
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

	@Override
	public Map<String, List<Integer>> groupByPath() {
		Map<String, List<Integer>> map = new TreeMap<>();
		for (int i=0; i<imageSource.getList().size(); i++) {
			Image image = imageSource.get(i);
			String key = image.getPath();
			if (map.containsKey(key)) {
				map.get(key).add(i);
			} else {
				List<Integer> list = new ArrayList<>();
				list.add(i);
				map.put(key, list);
			}
		}
		return map;
	}

}
