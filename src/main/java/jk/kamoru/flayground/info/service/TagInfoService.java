package jk.kamoru.flayground.info.service;

import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.info.domain.Tag;

@Service
public class TagInfoService extends InfoServiceAdapter<Tag, Integer> {

	@Autowired VideoInfoService videoInfoService;
	
	@Override
	public Tag create(Tag create) {
		create.setId(getNextId());
		return super.create(create);
	}

	private Integer getNextId() {
		return list().stream().max((t1, t2) -> NumberUtils.compare(t1.getId(), t2.getId())).get().getId() + 1;
	}

	@Override
	public void delete(Tag delete) {
		videoInfoService.removeTag(delete);
		super.delete(delete);
	}

}
