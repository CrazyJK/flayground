package jk.kamoru.flayground.flay.source;

import java.io.File;
import lombok.Builder;

@Builder
public class FlayFileResult {

  boolean valid;
  String studio;
  String opus;
  String title;
  String actress;
  String release;
  File file;

}
