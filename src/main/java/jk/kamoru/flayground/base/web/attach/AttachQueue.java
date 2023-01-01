package jk.kamoru.flayground.base.web.attach;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class AttachQueue {

  Map<String, Attach> attachMap = new ConcurrentHashMap<>();

}
