/** @flow */

export type PathGroup<T> = {
  content: ?T,
  children?: {[relativePath: string]: PathGroup<T>},
};

const SEP = '/';

function mkdirpInGroup<T>(
  group: PathGroup<T>,
  splitPath: Array<string>,
  content: T,
  skip: number = 0,
): void {
  if (skip >= splitPath.length) {
    return;
  }

  if (!group.children) {
    group.children = {};
  }
  const children = group.children;

  const key = splitPath[skip];
  if (!children.hasOwnProperty(key)) {
    children[key] = { content: null };
  }
  const childGroup = children[key];

  if (skip === splitPath.length - 1) {
    childGroup.content = content;
  }

  mkdirpInGroup(childGroup, splitPath, content, skip + 1);
}

function shortenPathsInGroup<T>(
  group: PathGroup<T>,
  separateGroupForContent: boolean,
): PathGroup<T> {
  const children = group.children;
  if (!children) {
    return group;
  }

  const childrenPaths = Object.keys(children);

  const newChildren = {};
  childrenPaths.forEach(childPath => {
    let newChildPath = childPath;
    let newChild =
      shortenPathsInGroup(children[childPath], separateGroupForContent);
    const grandChildren = newChild.children;
    if (grandChildren) {
      const grandChildrenPaths = Object.keys(grandChildren);
      const onlyOneGrandChild = grandChildrenPaths.length === 1;
      const onlyGrandChildPath = grandChildrenPaths[0];
      const onlyGrandChild = grandChildren[onlyGrandChildPath];
      if (
        onlyOneGrandChild &&
        // We can't merge content, so at most one can have content
        (newChild.content == null || onlyGrandChild.content == null) &&
        // If the grandchild has content but the caller doesn't want to merge
        // them, don't.
        (!separateGroupForContent || onlyGrandChild.content == null)
      ) {
        newChildPath = childPath + SEP + onlyGrandChildPath;
        const childContent = newChild.content;
        newChild = onlyGrandChild;
        newChild.content =
          childContent != null ? childContent : onlyGrandChild.content;
      }
    }
    newChildren[newChildPath] = newChild;
  });

  return {
    content: group.content,
    children: newChildren,
  };
}

// All paths are assumed to be absolute. I.e. an intial slash is optional.
export default function groupPaths<T>(
  pathsWithContent: Array<{
    path: string,
    content: T,
  }>,
  separateGroupForContent: boolean = true,
): PathGroup<T> {
  const splitPathsWithContent = pathsWithContent.map(p => ({
    // Remove empty segments in paths like 'a//b'.
    path: p.path.split(SEP).filter(segment => segment.length > 0),
    content: p.content,
  }));

  const rootGroup: PathGroup<T> = {
    content: null,
  };

  splitPathsWithContent.forEach(
    splitPathWithContent => mkdirpInGroup(
      rootGroup,
      splitPathWithContent.path,
      splitPathWithContent.content,
    ),
  );

  return shortenPathsInGroup(rootGroup, separateGroupForContent);
}
