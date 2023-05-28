package jk.kamoru.flayground.info.source;

import java.io.File;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.type.TypeReference;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.info.domain.Video;

@Repository
public class VideoInfoSource extends InfoSourceJsonAdapter<Video, String> {

  @Autowired
  FlayProperties flayProperties;

  @Override
  File getInfoFile() {
    return new File(flayProperties.getInfoPath(), Flayground.InfoFilename.VIDEO);
  }

  @Override
  TypeReference<CopyOnWriteArrayList<Video>> getTypeReference() {
    return new TypeReference<CopyOnWriteArrayList<Video>>() {
    };
  }

  @Override
  Video newInstance(String key) {
    return new Video(key);
  }

}
