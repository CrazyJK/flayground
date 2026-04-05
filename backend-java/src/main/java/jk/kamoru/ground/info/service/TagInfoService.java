package jk.kamoru.ground.info.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.ground.info.domain.Tag;

@Service
public class TagInfoService extends InfoServiceAdapter<Tag, Integer> {

  @Autowired
  VideoInfoService videoInfoService;

  @Override
  public Tag create(Tag create) {
    create.setId(getNextId());
    return super.create(create);
  }

  private Integer getNextId() {
    return list().stream().mapToInt(x -> x.getId()).max().orElse(0) + 1;
  }

  @Override
  public void delete(Tag delete) {
    videoInfoService.removeTag(delete);
    super.delete(delete);
  }

}
